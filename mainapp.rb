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
    erb :index, :locals => {:pictures => lines}
  end

  run! if app_file == $0
end

