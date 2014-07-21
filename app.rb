#!/usr/bin/env ruby

require 'rubygems'
require 'erb'
require 'json'
require 'sinatra'
require 'sinatra/content_for'

class SolringWebsite < Sinatra::Base
	helpers Sinatra::ContentFor
	
	set :static, true
	set :public_dir, File.dirname(__FILE__)+'/static'

  get '/' do
	fd = File.open(File.dirname(__FILE__)+'/static/res/pic.list')
	lines = fd.readlines()
    pics = []
    lines.each do |line|
        token = line.split(',')
        pics << {:id => token[0], :title => token[1], :url => token[2]}
    end
    erb :index, :locals => {:pictures => pics}
  end

  get '/:pid.json' do
    pid = params[:pid]
    fd = File.open(File.dirname(__FILE__)+"/static/res/#{pid}.json")
    fd.read()
    
  end

  run! if app_file == $0
end

